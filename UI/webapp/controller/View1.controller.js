/* global Promise */

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageToast, MessageBox) => {
    "use strict";

    const SERVICE_ACTIONS = {
        submitWork: "submitWork",
        grantConsent: "grantConsent",
        passportFor: "passportFor"
    };

    return Controller.extend("UI.controller.View1", {
        onInit() {
            this.getView().setModel(new JSONModel({
                role: "candidate",
                section: "tasks",
                pageTitle: this.getResourceBundle().getText("tasks"),
                navigation: [],
                tasks: [],
                candidates: [],
                shortlist: [],
                passport: null,
                passportAllowed: false,
                passportMessage: "",
                passportMessageType: "Information",
                consentStatus: this.getResourceBundle().getText("consentNotGranted"),
                consentState: "Warning",
                selectedTask: {},
                selectedCandidate: {},
                employerName: "Employer",
                submission: {},
                candidateAccounts: [],
                applications: [],
                submissions: [],
                decisionAction: "shortlisted"
            }), "view");
            this._setNavigation("candidate");
            this._loadTasks();
        },

        onOpenWorkspace() {
            MessageToast.show(this.getResourceBundle().getText("tasks"));
        },

        onOpenCandidateGuide() {
            const oBundle = this.getResourceBundle();
            const oDialog = new sap.m.Dialog({
                title: oBundle.getText("candidateGuideTitle"),
                contentWidth: "38rem",
                content: [
                    new sap.m.Text({
                        text: oBundle.getText("candidateGuideIntro"),
                        wrapping: true
                    }).addStyleClass("guideIntro"),
                    new sap.m.List({
                        showSeparators: "Inner",
                        items: [
                            new sap.m.StandardListItem({
                                title: oBundle.getText("tasks"),
                                description: oBundle.getText("tasksGuideDescription"),
                                icon: "sap-icon://task"
                            }),
                            new sap.m.StandardListItem({
                                title: oBundle.getText("abilityPassport"),
                                description: oBundle.getText("passportGuideDescription"),
                                icon: "sap-icon://badge"
                            }),
                            new sap.m.StandardListItem({
                                title: oBundle.getText("sharingConsent"),
                                description: oBundle.getText("consentGuideDescription"),
                                icon: "sap-icon://locked"
                            }),
                            new sap.m.StandardListItem({
                                title: oBundle.getText("applications"),
                                description: oBundle.getText("applicationsGuideDescription"),
                                icon: "sap-icon://workflow-tasks"
                            }),
                            new sap.m.StandardListItem({
                                title: oBundle.getText("submissions"),
                                description: oBundle.getText("submissionsGuideDescription"),
                                icon: "sap-icon://document-text"
                            }),
                            new sap.m.StandardListItem({
                                title: oBundle.getText("submitWork"),
                                description: oBundle.getText("submitGuideDescription"),
                                icon: "sap-icon://paper-plane"
                            })
                        ]
                    }).addStyleClass("guideList"),
                    new sap.m.VBox({
                        items: [
                            new sap.m.Title({
                                text: oBundle.getText("candidateGuideStepsTitle"),
                                level: "H3"
                            }),
                            new sap.m.Text({
                                text: oBundle.getText("candidateGuideSteps"),
                                wrapping: true
                            })
                        ]
                    }).addStyleClass("guideSteps")
                ],
                endButton: new sap.m.Button({
                    text: oBundle.getText("close"),
                    press: () => {
                        oDialog.close();
                        oDialog.destroy();
                    }
                })
            });
            oDialog.addStyleClass("candidateGuideDialog");
            oDialog.open();
        },

        onSectionSelect(oEvent) {
            this._navigate(oEvent.getParameter("key"));
        },

        onRefresh() {
            const sRole = this.getView().getModel("view").getProperty("/role");
            this._navigate(sRole === "candidate" ? "tasks" : "candidates");
            MessageToast.show(this.getResourceBundle().getText("refreshed"));
        },

        onCandidateAccountChange(oEvent) {
            const oCandidate = oEvent.getParameter("selectedItem").getBindingContext("view").getObject();
            this.getView().getModel("view").setProperty("/selectedCandidate", oCandidate);
            this.getView().getModel("view").setProperty("/passportSubtitle", oCandidate.displayName);
            this._loadApplications();
            this._loadSubmissions();
            this._loadConsentStatus();
        },

        getResourceBundle() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        _setNavigation(sRole) {
            const oBundle = this.getResourceBundle();
            const aNavigation = sRole === "candidate" ? [
                { key: "tasks", title: oBundle.getText("tasks"), icon: "sap-icon://task" },
                { key: "passport", title: oBundle.getText("abilityPassport"), icon: "sap-icon://badge" },
                { key: "consent", title: oBundle.getText("sharingConsent"), icon: "sap-icon://locked" }
            ] : [
                { key: "candidates", title: oBundle.getText("candidateList"), icon: "sap-icon://group" },
                { key: "shortlist", title: oBundle.getText("shortlist"), icon: "sap-icon://favorite" }
            ];
            this.getView().getModel("view").setProperty("/navigation", aNavigation);
        },

        onRoleChange(oEvent) {
            const sRole = oEvent.getParameter("item").getKey();
            const oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/role", sRole);
            oViewModel.setProperty("/passport", null);
            oViewModel.setProperty("/passportAllowed", false);
            oViewModel.setProperty("/passportMessage", "");
            this._setNavigation(sRole);
            this._navigate(sRole === "candidate" ? "tasks" : "candidates");
        },

        onNavigationSelect(oEvent) {
            const sKey = oEvent.getParameter("listItem").data("key");
            this._navigate(sKey);
        },

        _navigate(sSection) {
            const oViewModel = this.getView().getModel("view");
            const oBundle = this.getResourceBundle();
            const mTitles = {
                tasks: "tasks",
                passport: "abilityPassport",
                consent: "sharingConsent",
                candidates: "candidateList",
                shortlist: "shortlist"
            };
            oViewModel.setProperty("/section", sSection);
            oViewModel.setProperty("/pageTitle", oBundle.getText(mTitles[sSection] || "appTitle"));
            if (sSection === "tasks") {
                this._loadTasks();
            } else if (sSection === "candidates") {
                this._loadCandidates();
            } else if (sSection === "passport") {
                this._loadCandidatePassport();
            } else if (sSection === "shortlist") {
                this._loadShortlist();
            } else if (sSection === "applications") {
                this._loadApplications();
            } else if (sSection === "submissions") {
                this._loadSubmissions();
            } else if (sSection === "consent") {
                this._loadConsentStatus();
            }
        },

        _readCollection(sEntity) {
            return this.getOwnerComponent().getModel().bindList(`/${sEntity}`).requestContexts(0, 100)
                .then((aContexts) => aContexts.map((oContext) => oContext.getObject()));
        },

        _loadTasks() {
            return this._readCollection("Tasks").then((aTasks) => {
                const aMapped = aTasks.map((oTask) => ({
                    ...oTask,
                    title: oTask.title || oTask.name || oTask.ID,
                    description: oTask.description || oTask.brief || oTask.summary || "",
                    status: oTask.status || "",
                    statusState: oTask.status === "Completed" ? "Success" : "Information"
                }));
                this.getView().getModel("view").setProperty("/tasks", aMapped);
                return this._ensureCandidateContext();
            }).catch(this._handleError.bind(this));
        },

        _ensureCandidateContext() {
            const oViewModel = this.getView().getModel("view");
            return this._readCollection("Candidates").then((aCandidates) => {
                oViewModel.setProperty("/candidateAccounts", aCandidates);
                if (!oViewModel.getProperty("/selectedCandidate/ID") && aCandidates.length > 0) {
                    oViewModel.setProperty("/selectedCandidate", aCandidates[0]);
                    oViewModel.setProperty("/passportSubtitle", aCandidates[0].displayName || aCandidates[0].ID);
                }
                return Promise.all([this._loadApplications(), this._loadSubmissions(), this._loadConsentStatus()]);
            });
        },

        _loadConsentStatus() {
            const oViewModel = this.getView().getModel("view");
            const sCandidateId = oViewModel.getProperty("/selectedCandidate/ID");
            const sEmployerName = oViewModel.getProperty("/employerName") || "Employer";
            if (!sCandidateId) {
                return null;
            }
            return this._readCollection("Consents").then((aConsents) => {
                const bGranted = aConsents.some((oConsent) =>
                    (oConsent.candidate_ID || oConsent.candidateId) === sCandidateId &&
                    oConsent.employerName === sEmployerName &&
                    oConsent.granted === true &&
                    !oConsent.revokedAt
                );
                oViewModel.setProperty("/consentStatus", bGranted ?
                    this.getResourceBundle().getText("consentGranted") :
                    this.getResourceBundle().getText("consentNotGranted"));
                oViewModel.setProperty("/consentState", bGranted ? "Success" : "Warning");
            }).catch(this._handleError.bind(this));
        },

        _loadCandidates() {
            return this._readCollection("Candidates").then((aCandidates) => {
                const aMapped = aCandidates.map((oCandidate) => ({
                    ...oCandidate,
                    name: oCandidate.name || oCandidate.displayName || [oCandidate.firstName, oCandidate.lastName].filter(Boolean).join(" ") || oCandidate.ID,
                    headline: oCandidate.headline || oCandidate.title || "",
                    consentLabel: this.getResourceBundle().getText("checkingConsent"),
                    consentState: "Information"
                }));
                this.getView().getModel("view").setProperty("/candidates", aMapped);
                return Promise.all(aMapped.map((oCandidate, iIndex) =>
                    this._invokePassportFor(oCandidate.ID).then((oPassport) => {
                        const bConsent = !this._normalisePassport(oPassport).passportDenied;
                        this.getView().getModel("view").setProperty(`/candidates/${iIndex}/consentLabel`,
                            bConsent ? this.getResourceBundle().getText("consentGranted") : this.getResourceBundle().getText("consentNotGranted"));
                        this.getView().getModel("view").setProperty(`/candidates/${iIndex}/consentState`, bConsent ? "Success" : "Warning");
                    }).catch((oError) => {
                        if (this._isNoConsent(oError)) {
                            this.getView().getModel("view").setProperty(`/candidates/${iIndex}/consentLabel`, this.getResourceBundle().getText("consentNotGranted"));
                            this.getView().getModel("view").setProperty(`/candidates/${iIndex}/consentState`, "Warning");
                            return;
                        }
                        throw oError;
                    })
                ));
            }).catch(this._handleError.bind(this));
        },

        _loadShortlist() {
            return Promise.all([this._readCollection("Decisions"), this._readCollection("Candidates")])
                .then(([aDecisions, aCandidates]) => {
                    const mCandidateNames = aCandidates.reduce((mNames, oCandidate) => {
                        mNames[oCandidate.ID] = oCandidate.displayName || oCandidate.name || this.getResourceBundle().getText("candidate");
                        return mNames;
                    }, {});
                    const aMapped = aDecisions.map((oDecision) => ({
                        ...oDecision,
                        candidateName: oDecision.candidateName || oDecision.name ||
                            mCandidateNames[oDecision.candidate_ID] ||
                            this.getResourceBundle().getText("candidate"),
                        decision: oDecision.decision || oDecision.reason || oDecision.note || "",
                        status: oDecision.status || oDecision.action || "",
                        state: oDecision.status === "Accepted" || oDecision.action === "accepted" ? "Success" : "Information"
                    }));
                    this.getView().getModel("view").setProperty("/shortlist", aMapped);
                }).catch(this._handleError.bind(this));
        },

        _loadApplications() {
            const sCandidateId = this.getView().getModel("view").getProperty("/selectedCandidate/ID");
            if (!sCandidateId) {
                return null;
            }
            return this._readCollection("Decisions").then((aDecisions) => {
                const aApplications = aDecisions.filter((oDecision) =>
                    (oDecision.candidate_ID || oDecision.candidateId) === sCandidateId)
                    .map((oDecision) => {
                        const sStatus = (oDecision.action || oDecision.status || "").toLowerCase();
                        let sStatusState = "Information";
                        if (sStatus === "accepted") {
                            sStatusState = "Success";
                        } else if (sStatus === "declined") {
                            sStatusState = "Error";
                        } else if (sStatus === "withdrawn") {
                            sStatusState = "Warning";
                        }
                        return {
                            ...oDecision,
                            statusLabel: oDecision.action || oDecision.status || "",
                            statusState: sStatusState,
                            canWithdraw: !["withdrawn", "declined"].includes(sStatus),
                            note: oDecision.note || oDecision.decidedBy || ""
                        };
                    });
                this.getView().getModel("view").setProperty("/applications", aApplications);
            }).catch(this._handleError.bind(this));
        },

        onWithdrawApplication(oEvent) {
            const oApplication = oEvent.getSource().getBindingContext("view").getObject();
            MessageBox.confirm(this.getResourceBundle().getText("withdrawApplicationConfirm"), {
                title: this.getResourceBundle().getText("withdrawApplication"),
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.OK) {
                        return;
                    }
                    const oViewModel = this.getView().getModel("view");
                    const oCandidate = oViewModel.getProperty("/selectedCandidate");
                    const oContext = this.getOwnerComponent().getModel().bindList("/Decisions").create({
                        ["candidate_ID"]: oCandidate.ID,
                        employerName: oApplication.employerName || oViewModel.getProperty("/employerName") || "Employer",
                        action: "withdrawn",
                        decidedBy: oCandidate.displayName || oCandidate.name || oCandidate.ID,
                        note: this.getResourceBundle().getText("withdrawnByCandidate")
                    });
                    oContext.created().then(() => {
                        MessageToast.show(this.getResourceBundle().getText("applicationWithdrawn"));
                        return this._loadApplications();
                    }).catch(this._handleError.bind(this));
                }
            });
        },

        _loadSubmissions() {
            const sCandidateId = this.getView().getModel("view").getProperty("/selectedCandidate/ID");
            if (!sCandidateId) {
                this.getView().getModel("view").setProperty("/submissions", []);
                return null;
            }
            return Promise.all([this._readCollection("Submissions"), this._readCollection("Tasks")])
                .then(([aSubmissions, aTasks]) => {
                    const mTaskTitles = aTasks.reduce((mTitles, oTask) => {
                        mTitles[oTask.ID] = oTask.title || oTask.ID;
                        return mTitles;
                    }, {});
                    const aMapped = aSubmissions.filter((oSubmission) =>
                        (oSubmission.candidate_ID || oSubmission.candidateId) === sCandidateId)
                        .map((oSubmission) => ({
                            ...oSubmission,
                            taskTitle: mTaskTitles[oSubmission.task_ID] || oSubmission.task_ID || this.getResourceBundle().getText("submission"),
                            statusState: oSubmission.status === "scored" ? "Success" : "Information"
                        }));
                    this.getView().getModel("view").setProperty("/submissions", aMapped);
                }).catch(this._handleError.bind(this));
        },

        onRemoveSubmission(oEvent) {
            const oSubmission = oEvent.getSource().getBindingContext("view").getObject();
            MessageBox.confirm(this.getResourceBundle().getText("removeSubmissionConfirm"), {
                title: this.getResourceBundle().getText("removeSubmission"),
                onClose: (sAction) => {
                    if (sAction !== MessageBox.Action.OK) {
                        return;
                    }
                    this.getOwnerComponent().getModel().bindList("/Submissions").requestContexts(0, 100)
                        .then((aContexts) => aContexts.find((oSubmissionContext) =>
                            oSubmissionContext.getObject().ID === oSubmission.ID))
                        .then((oContext) => {
                            if (!oContext) {
                                throw new Error(this.getResourceBundle().getText("submissionNotFound"));
                            }
                            return oContext.delete();
                        })
                        .then(() => {
                            MessageToast.show(this.getResourceBundle().getText("submissionRemoved"));
                            return Promise.all([this._loadSubmissions(), this._loadTasks()]);
                        })
                        .catch(this._handleError.bind(this));
                }
            });
        },

        onEvidencePress(oEvent) {
            const oEvidence = oEvent.getSource().getBindingContext("view").getObject();
            const oDialog = new sap.m.Dialog({
                title: oEvidence.title || this.getResourceBundle().getText("evidence"),
                contentWidth: "42rem",
                content: [
                    new sap.m.Text({ text: oEvidence.description || oEvidence.evidence || this.getResourceBundle().getText("noEvidence") })
                ],
                endButton: new sap.m.Button({
                    text: this.getResourceBundle().getText("close"),
                    press: () => {
                        oDialog.close();
                        oDialog.destroy();
                    }
                })
            });
            oDialog.open();
        },

        onAddCandidate() {
            const oDialog = new sap.m.Dialog({
                title: this.getResourceBundle().getText("addCandidate"),
                contentWidth: "28rem",
                content: [
                    new sap.m.Label({ text: this.getResourceBundle().getText("candidateName") }),
                    new sap.m.Input("candidateNameInput"),
                    new sap.m.Label({ text: this.getResourceBundle().getText("candidateEmail") }),
                    new sap.m.Input("candidateEmailInput", { type: "Email" }),
                    new sap.m.Label({ text: this.getResourceBundle().getText("workPreferences") }),
                    new sap.m.TextArea("candidatePrefsInput", { rows: 3 })
                ],
                beginButton: new sap.m.Button({
                    text: this.getResourceBundle().getText("save"),
                    type: "Emphasized",
                    press: () => {
                        const oModel = this.getOwnerComponent().getModel();
                        const oContext = oModel.bindList("/Candidates").create({
                            displayName: sap.ui.getCore().byId("candidateNameInput").getValue(),
                            email: sap.ui.getCore().byId("candidateEmailInput").getValue(),
                            workPrefs: sap.ui.getCore().byId("candidatePrefsInput").getValue()
                        });
                        oContext.created().then(() => {
                            const oCandidate = oContext.getObject();
                            this.getView().getModel("view").setProperty("/selectedCandidate", oCandidate);
                            oDialog.close();
                            oDialog.destroy();
                            MessageToast.show(this.getResourceBundle().getText("candidateAdded"));
                            return Promise.all([this._loadCandidates(), this._ensureCandidateContext()]);
                        }).catch(this._handleError.bind(this));
                    }
                }),
                endButton: new sap.m.Button({
                    text: this.getResourceBundle().getText("cancel"),
                    press: () => {
                        oDialog.close();
                        oDialog.destroy();
                    }
                })
            });
            oDialog.open();
        },

        onCreateDecision(oEvent) {
            const oViewModel = this.getView().getModel("view");
            const oCandidate = oViewModel.getProperty("/selectedCandidate");
            const sAction = oViewModel.getProperty("/decisionAction") || "shortlisted";
            const oContext = this.getOwnerComponent().getModel().bindList("/Decisions").create({
                ["candidate_ID"]: oCandidate.ID,
                employerName: oViewModel.getProperty("/employerName") || "Employer",
                action: sAction,
                decidedBy: oViewModel.getProperty("/employerName") || "Employer",
                note: ""
            });
            oContext.created().then(() => {
                MessageToast.show(this.getResourceBundle().getText("decisionSaved"));
                this._loadShortlist();
            }).catch(this._handleError.bind(this));
        },

        onTaskPress(oEvent) {
            const oTask = oEvent.getSource().getBindingContext("view").getObject();
            this.getView().getModel("view").setProperty("/selectedTask", oTask);
            this._navigate("submit");
        },

        onSubmitWorkPage() {
            this._navigate("submit");
        },

        onSubmitWork() {
            const oViewModel = this.getView().getModel("view");
            const oTask = oViewModel.getProperty("/selectedTask");
            const oSubmission = oViewModel.getProperty("/submission") || {};
            const oAction = this.getOwnerComponent().getModel().bindContext(`/${SERVICE_ACTIONS.submitWork}(...)`);
            oAction.setParameter("taskID", oTask.ID);
            oAction.setParameter("candidateID", oViewModel.getProperty("/selectedCandidate/ID"));
            oAction.setParameter("answer", oSubmission.evidence || "");
            oAction.execute().then(() => oAction.getBoundContext().requestObject()).then((oResult) => {
                oViewModel.setProperty("/passport", this._normalisePassport(oResult));
                oViewModel.setProperty("/passportMessage", "");
                MessageToast.show(this.getResourceBundle().getText("workSubmitted"));
                return this._loadTasks();
            }).then(() => {
                this._navigate("passport");
            }).catch(this._handleError.bind(this));
        },

        onGrantConsent() {
            const oViewModel = this.getView().getModel("view");
            const oAction = this.getOwnerComponent().getModel().bindContext(`/${SERVICE_ACTIONS.grantConsent}(...)`);
            oAction.setParameter("candidateID", oViewModel.getProperty("/selectedCandidate/ID") || "");
            oAction.setParameter("employerName", oViewModel.getProperty("/employerName") || "Employer");
            oAction.execute().then(() => {
                return this._loadConsentStatus();
            }).then(() => {
                MessageToast.show(this.getResourceBundle().getText("consentUpdated"));
            }).catch(this._handleError.bind(this));
        },

        _loadCandidatePassport() {
            const oViewModel = this.getView().getModel("view");
            const oCandidate = oViewModel.getProperty("/selectedCandidate");
            if (!oCandidate.ID) {
                return null;
            }
            return this._invokePassportFor(oCandidate.ID).then((oPassport) => {
                const oPassportData = this._normalisePassport(oPassport);
                oViewModel.setProperty("/passportAllowed", !oPassportData.passportDenied);
                oViewModel.setProperty("/passport", oPassportData.passportDenied ? null : oPassportData);
                oViewModel.setProperty("/passportMessage", oPassportData.passportDenied ? this.getResourceBundle().getText("noConsentMessage") : "");
            }).catch((oError) => {
                if (this._isNoConsent(oError)) {
                    oViewModel.setProperty("/passport", null);
                    oViewModel.setProperty("/passportAllowed", false);
                    oViewModel.setProperty("/passportMessage", this.getResourceBundle().getText("noConsentMessage"));
                    oViewModel.setProperty("/passportMessageType", "Warning");
                    return;
                }
                this._handleError(oError);
            });
        },

        _invokePassportFor(sCandidateId) {
            const oAction = this.getOwnerComponent().getModel().bindContext(`/${SERVICE_ACTIONS.passportFor}(...)`);
            oAction.setParameter("candidateID", sCandidateId);
            oAction.setParameter("employerName", this.getView().getModel("view").getProperty("/employerName") || "Employer");
            return oAction.execute().then(() => oAction.getBoundContext().requestObject());
        },

        onCandidatePress(oEvent) {
            const oCandidate = oEvent.getSource().getBindingContext("view").getObject();
            const oViewModel = this.getView().getModel("view");
            oViewModel.setProperty("/selectedCandidate", oCandidate);
            oViewModel.setProperty("/passportSubtitle", oCandidate.name);
            oViewModel.setProperty("/passport", null);
            oViewModel.setProperty("/passportAllowed", false);
            oViewModel.setProperty("/passportMessage", "");
            this._invokePassportFor(oCandidate.ID).then((oPassport) => {
                const oPassportData = this._normalisePassport(oPassport);
                oViewModel.setProperty("/passportAllowed", !oPassportData.passportDenied);
                oViewModel.setProperty("/passport", oPassportData.passportDenied ? null : oPassportData);
                oViewModel.setProperty("/passportMessage", oPassportData.passportDenied ? this.getResourceBundle().getText("noConsentMessage") : "");
                oViewModel.setProperty("/passportMessageType", "Warning");
                this._navigate("passport");
            }).catch((oError) => {
                if (this._isNoConsent(oError)) {
                    oViewModel.setProperty("/passport", null);
                    oViewModel.setProperty("/passportAllowed", false);
                    oViewModel.setProperty("/passportMessage", this.getResourceBundle().getText("noConsentMessage"));
                    oViewModel.setProperty("/passportMessageType", "Warning");
                    this._navigate("passport");
                    return;
                }
                this._handleError(oError);
            });
        },

        _normalisePassport(oPassport) {
            let oPassportData = oPassport && Object.prototype.hasOwnProperty.call(oPassport, "value") ?
                oPassport.value : oPassport;
            if (typeof oPassportData === "string") {
                try {
                    oPassportData = JSON.parse(oPassportData);
                } catch {
                    oPassportData = { raw: oPassportData };
                }
            }
            const aVerifications = oPassportData.verifications || [];
            const aSkills = oPassportData.verifiedSkills || oPassportData.skills ||
                aVerifications.reduce((aAllSkills, oVerification) => aAllSkills.concat(oVerification.skills || []), []);
            const aEvidence = oPassportData.evidence || oPassportData.submissions ||
                aVerifications.map((oVerification) => ({
                    title: `Verification (${oVerification.confidence || "backend"})`,
                    description: oVerification.reasoning || (oVerification.skills || []).map((oSkill) => oSkill.evidence).filter(Boolean).join(" ")
                }));
            return {
                ...oPassportData,
                scoreLabel: oPassportData.scoreLabel || oPassportData.score || oPassportData.overallScore ||
                    (aVerifications.length ? `${aVerifications[0].score} / 10` : ""),
                verifiedSkills: aSkills.map((oSkill) => typeof oSkill === "string" ? { name: oSkill } : {
                    ...oSkill,
                    name: oSkill.name || oSkill.skill,
                    scoreLabel: oSkill.score === undefined ? "" : `Score: ${oSkill.score}`
                }),
                evidence: aEvidence.map((oEvidence) => typeof oEvidence === "string" ? { title: oEvidence } : oEvidence),
                passportDenied: oPassportData.error === "NO_CONSENT"
            };
        },

        onNavigateFromPassport() {
            this._navigate("consent");
        },

        _isNoConsent(oError) {
            const sMessage = oError && (oError.message || oError.cause && oError.cause.message || "");
            return /NO_CONSENT/i.test(sMessage) || (oError && oError.error === "NO_CONSENT");
        },

        _handleError(oError) {
            const sMessage = oError && (oError.message || oError.cause && oError.cause.message);
            MessageBox.error(sMessage || this.getResourceBundle().getText("backendError"));
        }
    });
});
